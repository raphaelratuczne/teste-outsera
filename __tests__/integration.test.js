import request from 'supertest';
import { closeDbConnection } from '../database.js';
import { app, closeServer, startPromise } from '../server.js';

// Aguarda o servidor estar completamente inicializado (DB carregado, servidor escutando)
beforeAll(async () => {
  await startPromise;
});

// Fecha a conexão com o DB e o servidor HTTP após todos os testes
afterAll(async () => {
  await closeDbConnection();
  await closeServer();
});

describe('Movie API - /movies', () => {
  it('GET /movies - deve retornar todos os filmes com status 200', async () => {
    const response = await request(app).get('/movies');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('year');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('winner');
    }
  });

  it('GET /movies?year=1980 - deve retornar filmes do ano de 1980', async () => {
    const response = await request(app).get('/movies?year=1980');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((movie) => {
      expect(movie.year).toBe(1980);
    });
  });

  it('GET /movies?winner=true - deve retornar filmes vencedores', async () => {
    const response = await request(app).get('/movies?winner=true');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((movie) => {
      expect(movie.winner).toBe(true);
    });
  });

  it('GET /movies?year=1980&winner=true - deve retornar filmes vencedores de 1980', async () => {
    const response = await request(app).get('/movies?year=1980&winner=true');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((movie) => {
      expect(movie.year).toBe(1980);
      expect(movie.winner).toBe(true);
    });
  });

  it('GET /movies?year=invalid - deve retornar erro 400', async () => {
    const response = await request(app).get('/movies?year=invalid');
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('GET /movies?winner=yes - deve retornar erro 400 (winner deve ser true/false)', async () => {
    const response = await request(app).get('/movies?winner=yes');
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Producer API - /producers/win-intervals', () => {
  it('GET /producers/win-intervals - deve retornar os intervalos de prêmios com status 200', async () => {
    const response = await request(app).get('/producers/win-intervals');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('min');
    expect(response.body).toHaveProperty('max');
    expect(Array.isArray(response.body.min)).toBe(true);
    expect(Array.isArray(response.body.max)).toBe(true);

    const checkIntervalItem = (item) => {
      expect(item).toHaveProperty('producer');
      expect(typeof item.producer).toBe('string');
      expect(item).toHaveProperty('interval');
      expect(typeof item.interval).toBe('number');
      expect(item.interval).toBeGreaterThanOrEqual(0); // Intervalo não pode ser negativo
      expect(item).toHaveProperty('previousWin');
      expect(typeof item.previousWin).toBe('number');
      expect(item).toHaveProperty('followingWin');
      expect(typeof item.followingWin).toBe('number');
      expect(item.followingWin).toBeGreaterThanOrEqual(item.previousWin);
      if (item.interval > 0) {
        expect(item.followingWin - item.previousWin).toBe(item.interval);
      }
    };

    response.body.min.forEach(checkIntervalItem);
    response.body.max.forEach(checkIntervalItem);

    // Verifica consistência dos intervalos min e max
    if (response.body.min.length > 0 && response.body.max.length > 0) {
      const minIntervalValue = response.body.min[0].interval;
      const maxIntervalValue = response.body.max[0].interval;
      expect(maxIntervalValue).toBeGreaterThanOrEqual(minIntervalValue);
      response.body.min.forEach((item) =>
        expect(item.interval).toBe(minIntervalValue)
      );
      response.body.max.forEach((item) =>
        expect(item.interval).toBe(maxIntervalValue)
      );
    } else if (response.body.min.length > 0) {
      const minIntervalValue = response.body.min[0].interval;
      response.body.min.forEach((item) =>
        expect(item.interval).toBe(minIntervalValue)
      );
    } else if (response.body.max.length > 0) {
      const maxIntervalValue = response.body.max[0].interval;
      response.body.max.forEach((item) =>
        expect(item.interval).toBe(maxIntervalValue)
      );
    }
  });

  // Teste específico para o exemplo do desafio (se você tiver um CSV previsível)
  // Este teste assume que o CSV padrão `movielist.csv` contém dados que resultam
  // em Joel Silver tendo o menor intervalo (1 ano) e Matthew Vaughn o maior (21 anos).
  // Se o seu CSV for diferente, ajuste ou remova este teste.
  it('GET /producers/win-intervals - deve retornar resultados específicos para o CSV padrão', async () => {
    const response = await request(app).get('/producers/win-intervals');
    expect(response.statusCode).toBe(200);

    // Produtor com menor intervalo
    const minProducers = response.body.min.map((p) => p.producer);
    // Exemplo: verificar se um produtor específico está na lista de menor intervalo
    // Este é um exemplo, você precisaria saber o resultado esperado do seu CSV
    if (response.body.min.length > 0) {
      expect(response.body.min[0].interval).toBe(1); // Exemplo: menor intervalo é 1
      // expect(minProducers).toContain('Joel Silver'); // Exemplo
    }

    // Produtor com maior intervalo
    const maxProducers = response.body.max.map((p) => p.producer);
    if (response.body.max.length > 0) {
      // Exemplo: verificar se um produtor específico está na lista de maior intervalo
      // expect(maxProducers).toContain('Matthew Vaughn'); // Exemplo
      // expect(response.body.max[0].interval).toBeGreaterThanOrEqual(1); // Exemplo
    }
  });
});
