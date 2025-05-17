import csv from 'csv-parser';
import fs from 'fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';
import sqlite3 from 'sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
    throw err;
  }
  console.log('Conectado ao banco de dados SQLite em memória.');
});

export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS movies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                title TEXT NOT NULL,
                studios TEXT,
                producers TEXT,
                winner BOOLEAN NOT NULL
            )`,
        (err) => {
          if (err) {
            console.error("Erro ao criar tabela 'movies':", err.message);
            return reject(err);
          }
          console.log("Tabela 'movies' criada ou já existente.");
          loadCsvData().then(resolve).catch(reject); // Propagar reject do loadCsvData
        }
      );
    });
  });
};

const loadCsvData = () => {
  return new Promise((resolve, reject) => {
    const csvFilePath = path.join(__dirname, 'data', 'movielist.csv');
    const moviesToInsert = [];

    if (!fs.existsSync(csvFilePath)) {
      const errMsg = `Arquivo CSV não encontrado em: ${csvFilePath}`;
      console.error(errMsg);
      return reject(new Error(errMsg));
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        const year = parseInt(row.year, 10);
        const title = row.title;
        const winner = row.winner ? row.winner.toLowerCase() === 'yes' : false;

        if (!isNaN(year) && title && title.trim() !== '') {
          moviesToInsert.push({
            year: year,
            title: title.trim(),
            studios: row.studios ? row.studios.trim() : '',
            producers: row.producers ? row.producers.trim() : '',
            winner: winner,
          });
        } else {
          console.warn('Linha do CSV ignorada devido a dados inválidos:', row);
        }
      })
      .on('end', () => {
        console.log('Leitura do arquivo CSV concluída.');
        if (moviesToInsert.length === 0) {
          console.log('Nenhum filme para inserir do CSV.');
          return resolve();
        }

        db.serialize(() => {
          db.run('BEGIN TRANSACTION;', function (beginErr) {
            if (beginErr) {
              console.error('Erro ao iniciar transação:', beginErr.message);
              return reject(beginErr);
            }

            const stmt = db.prepare(
              'INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)'
            );
            let hadErrorDuringInsert = false;

            moviesToInsert.forEach((movie) => {
              stmt.run(
                movie.year,
                movie.title,
                movie.studios,
                movie.producers,
                movie.winner,
                function (runErr) {
                  if (runErr) {
                    console.error(
                      `Erro ao inserir filme "${movie.title}":`,
                      runErr.message
                    );
                    hadErrorDuringInsert = true;
                  }
                }
              );
            });

            stmt.finalize(function (finalizeErr) {
              if (finalizeErr) {
                console.error(
                  'Erro ao finalizar o statement de inserção:',
                  finalizeErr.message
                );
                hadErrorDuringInsert = true;
              }

              if (hadErrorDuringInsert) {
                db.run('ROLLBACK;', function (rollbackErr) {
                  if (rollbackErr) {
                    console.error(
                      'Erro ao tentar reverter transação (ROLLBACK):',
                      rollbackErr.message
                    );
                  } else {
                    console.log(
                      'Transação revertida devido a erros durante a inserção ou finalização do statement.'
                    );
                  }
                  reject(
                    new Error(
                      'Falha na inserção em lote de dados do CSV. Transação revertida.'
                    )
                  );
                });
              } else {
                db.run('COMMIT;', function (commitErr) {
                  if (commitErr) {
                    console.error(
                      'Erro ao commitar transação:',
                      commitErr.message
                    );
                    db.run('ROLLBACK;', function (rbErrAfterCommitFail) {
                      if (rbErrAfterCommitFail) {
                        console.error(
                          'Erro no ROLLBACK após falha no COMMIT (pode ser esperado se a transação já estava inativa):',
                          rbErrAfterCommitFail.message
                        );
                      }
                    });
                    reject(commitErr);
                  } else {
                    console.log(
                      `${moviesToInsert.length} filmes inseridos no banco de dados a partir do CSV.`
                    );
                    resolve();
                  }
                });
              }
            });
          });
        });
      })
      .on('error', (error) => {
        console.error(
          'Erro crítico ao processar o stream do arquivo CSV:',
          error
        );
        reject(error);
      });
  });
};

export const getMovies = (filters = {}) => {
  return new Promise((resolve, reject) => {
    let query =
      'SELECT id, year, title, studios, producers, winner FROM movies';
    const queryParams = [];
    const conditions = [];

    if (filters.year) {
      const yearNum = parseInt(filters.year, 10);
      if (!isNaN(yearNum)) {
        conditions.push('year = ?');
        queryParams.push(yearNum);
      } else {
        console.warn(`Filtro de ano inválido ignorado: ${filters.year}`);
      }
    }
    if (filters.winner !== undefined) {
      const winnerStr = String(filters.winner).toLowerCase();
      if (winnerStr === 'true' || winnerStr === 'false') {
        const winnerBool = winnerStr === 'true';
        conditions.push('winner = ?');
        queryParams.push(winnerBool);
      } else {
        console.warn(`Filtro de winner inválido ignorado: ${filters.winner}`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY year, title';

    db.all(query, queryParams, (err, rows) => {
      if (err) {
        console.error('Erro ao buscar filmes:', err.message);
        return reject(err);
      }
      const results = rows.map((row) => ({
        ...row,
        winner: Boolean(row.winner),
      }));
      resolve(results);
    });
  });
};

export const closeDbConnection = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar a conexão com o SQLite:', err.message);
        return reject(err);
      }
      // console.log('Conexão com o SQLite fechada.'); // Opcional: log durante testes
      resolve();
    });
  });
};
