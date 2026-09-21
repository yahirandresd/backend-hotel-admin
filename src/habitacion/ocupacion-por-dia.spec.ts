import { ocupadasPorDia } from './ocupacion-por-dia';

describe('ocupadasPorDia', () => {
  it('devuelve una fila por día del rango (inclusive) en cero si no hay estadías', () => {
    expect(ocupadasPorDia([], '2026-03-01', '2026-03-03')).toEqual([
      { fecha: '2026-03-01', ocupadas: 0 },
      { fecha: '2026-03-02', ocupadas: 0 },
      { fecha: '2026-03-03', ocupadas: 0 },
    ]);
  });

  it('cuenta el día de ingreso pero no el de salida', () => {
    const r = ocupadasPorDia(
      [{ habitacionId: 1, fechaIngreso: '2026-03-02', fechaSalida: '2026-03-04' }],
      '2026-03-01',
      '2026-03-05',
    );
    expect(r.map((f) => f.ocupadas)).toEqual([0, 1, 1, 0, 0]);
  });

  it('cuenta una habitación una sola vez aunque tenga varios huéspedes', () => {
    const estadia = { habitacionId: 7, fechaIngreso: '2026-03-01', fechaSalida: '2026-03-02' };
    const r = ocupadasPorDia([estadia, estadia, estadia], '2026-03-01', '2026-03-01');
    expect(r).toEqual([{ fecha: '2026-03-01', ocupadas: 1 }]);
  });

  it('cuenta habitaciones distintas y una misma habitación en reservas seguidas', () => {
    const r = ocupadasPorDia(
      [
        { habitacionId: 1, fechaIngreso: '2026-03-01', fechaSalida: '2026-03-03' },
        { habitacionId: 2, fechaIngreso: '2026-03-02', fechaSalida: '2026-03-04' },
        { habitacionId: 1, fechaIngreso: '2026-03-03', fechaSalida: '2026-03-04' },
      ],
      '2026-03-01',
      '2026-03-04',
    );
    expect(r.map((f) => f.ocupadas)).toEqual([1, 2, 2, 0]);
  });

  it('recorta estadías que empiezan antes o terminan después del rango', () => {
    const r = ocupadasPorDia(
      [{ habitacionId: 1, fechaIngreso: '2026-02-20', fechaSalida: '2026-04-10' }],
      '2026-03-30',
      '2026-04-02',
    );
    expect(r.map((f) => f.ocupadas)).toEqual([1, 1, 1, 1]);
  });

  it('ignora estadías totalmente fuera del rango', () => {
    const r = ocupadasPorDia(
      [
        { habitacionId: 1, fechaIngreso: '2026-02-01', fechaSalida: '2026-02-10' },
        { habitacionId: 2, fechaIngreso: '2026-03-05', fechaSalida: '2026-03-09' },
        // sale justo el primer día del rango: ese día ya no cuenta
        { habitacionId: 3, fechaIngreso: '2026-02-27', fechaSalida: '2026-03-01' },
      ],
      '2026-03-01',
      '2026-03-03',
    );
    expect(r.map((f) => f.ocupadas)).toEqual([0, 0, 0]);
  });

  it('cruza el fin de mes y el fin de año sin saltarse días', () => {
    const r = ocupadasPorDia([], '2026-12-30', '2027-01-02');
    expect(r.map((f) => f.fecha)).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });

  it('toma solo el día cuando el cliente manda fecha con hora', () => {
    const r = ocupadasPorDia([], '2026-03-01T23:30:00', '2026-03-02T00:10:00');
    expect(r.map((f) => f.fecha)).toEqual(['2026-03-01', '2026-03-02']);
  });
});
