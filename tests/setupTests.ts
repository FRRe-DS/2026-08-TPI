import { setupTestJwks } from './helpers/tokenHelper';

// Ejecutar inmediatamente para que esté listo antes de cualquier beforeAll()
setupTestJwks();

// Y restablecer antes de cada test por si jest.clearMocks() lo afecta
beforeEach(() => {
  setupTestJwks();
});
