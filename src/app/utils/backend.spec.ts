import { Csv } from './backend';

describe('Csv', () => {

  it('convert 2d array to csv', () => {
    expect(
      Csv.fromArray([['Str', 'Num'], ['a', 1], ['b', 2.1]]),
    ).toBe('"Str","Num"\n"a",1\n"b",2.1');
  });
  it('convert 2d array to csv and correctly handle null values', () => {
    expect(
      Csv.fromArray([['C1', 'C2'], [true, null], [false, 'null']], ',', 'EMPTY'),
    ).toBe('"C1","C2"\n"true",EMPTY\n"false","null"');
  });
  it('convert 2d array to csv with custom delimiter', () => {
    expect(
      Csv.fromArray([['C1', 'C2', 'C3'], [1, 2, 3], [2, 4, 6]], ';'),
    ).toBe('"C1";"C2";"C3"\n1;2;3\n2;4;6');
  });
  it('convert csv data to 2d array', () => {
    expect(
      Csv.toArray('"Str","Num"\n"a",1\n"b",2.1'),
    ).toEqual([['Str', 'Num'], ['a', '1'], ['b', '2.1']]);
  });
  it('convert csv data with custom delimiter to 2d array ', () => {
    expect(
      Csv.toArray('"C1";"C2";"C3"\n1;2;3\n2;4;6', ';'),
    ).toEqual([['C1', 'C2', 'C3'], ['1', '2', '3'], ['2', '4', '6']]);
  });
});
