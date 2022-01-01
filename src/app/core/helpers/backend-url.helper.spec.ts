import { backendUrl } from './backend-url.helper';

describe('backendUrl', () => {
  it('should form url', () => {
    expect(backendUrl('word')).toEqual('word');
    expect(backendUrl('prefix/word')).toEqual('prefix/word');
    expect(backendUrl('complex prefix/complex word!')).toEqual('complex%20prefix/complex%20word!');
    expect(backendUrl('w\\w', ['p1', 'p2%20'])).toEqual('w%5Cw/p1/p2%2520');
  });
});
