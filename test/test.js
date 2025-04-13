const expect = require('chai').expect;
const groupBy = require('../json-groupby.js');

const products = [
  { id: 1, product: 'ri', price: 16, color: 'green', available: false, tags: ['bravo'], vendor: { name: 'Donald Chambers', address: { city: 'Mumbai' } } },
  { id: 2, product: 'foef', price: 44, color: 'yellow', available: false, tags: ['alpha'], vendor: { name: 'Barbara Garrett', address: { city: 'Mumbai' } } },
  { id: 3, product: 'jehnojto', price: 29, color: 'red', available: true, tags: ['alpha'], vendor: { name: 'Anne Leonard', address: { city: 'New York' } } },
  { id: 4, product: 'ru', price: 35, color: 'yellow', available: false, tags: ['echo', 'charlie', 'bravo'], vendor: { name: 'Justin Doyle', address: { city: 'London' } } },
  { id: 5, product: 'pihluve', price: 47, color: 'green', available: true, tags: ['delta', 'echo', 'bravo'], vendor: { name: 'Emily Abbott', address: { city: 'New York' } } },
  { id: 6, product: 'dum', price: 28, color: 'green', available: true, tags: ['echo', 'delta', 'charlie'], vendor: { name: 'Henry Peterson', address: { city: 'New York' } } },
  { id: 7, product: 'zifpeza', price: 10, color: 'green', available: false, tags: ['echo', 'charlie', 'bravo'], vendor: { name: 'Jesus Lowe', address: { city: 'Mumbai' } } },
  { id: 8, product: 'av', price: 39, color: 'green', available: true, tags: ['bravo'], vendor: { name: 'Rosalie Erickson', address: { city: 'New York' } } }
];

describe('groupBy: ', function () {
  it('single property (object output)', function () {
    const result = groupBy(products, ['color'], ['id']);
    expect(result).to.deep.equal({
      green: { id: [1, 5, 6, 7, 8] },
      yellow: { id: [2, 4] },
      red: { id: [3] }
    });
  });

  it('single property (array output)', function () {
    const result = groupBy(products, ['color'], ['id'], true);
    expect(result).to.deep.equal([
      { key: 'green', values: { id: [1, 5, 6, 7, 8] } },
      { key: 'yellow', values: { id: [2, 4] } },
      { key: 'red', values: { id: [3] } }
    ]);
  });

  it('nested property (object output)', function () {
    const result = groupBy(products, ['vendor.address.city'], ['id']);
    expect(result).to.deep.equal({
      Mumbai: { id: [1, 2, 7] },
      'New York': { id: [3, 5, 6, 8] },
      London: { id: [4] }
    });
  });

  it('nested property (array output)', function () {
    const result = groupBy(products, ['vendor.address.city'], ['id'], true);
    expect(result).to.deep.equal([
      { key: 'Mumbai', values: { id: [1, 2, 7] } },
      { key: 'New York', values: { id: [3, 5, 6, 8] } },
      { key: 'London', values: { id: [4] } }
    ]);
  });

  it('boolean property', function () {
    const result = groupBy(products, ['available'], ['id']);
    expect(result).to.deep.equal({
      false: { id: [1, 2, 4, 7] },
      true: { id: [3, 5, 6, 8] }
    });
  });

  it('interval lookup without labels', function () {
    const result = groupBy(products, [{ property: 'price', intervals: [10, 20, 40, 50] }], ['id']);
    expect(result).to.deep.equal({
      '0': { id: [1, 7] },
      '1': { id: [3, 4, 6, 8] },
      '2': { id: [2, 5] }
    });
  });

  it('interval lookup with labels', function () {
    const result = groupBy(products, [{ property: 'price', intervals: [10, 20, 40, 50], labels: ['low', 'medium', 'high'] }], ['id']);
    expect(result).to.deep.equal({
      low: { id: [1, 7] },
      medium: { id: [3, 4, 6, 8] },
      high: { id: [2, 5] }
    });
  });

  it('tags in array', function () {
    const result = groupBy(products, ['tags'], ['id']);
    expect(result).to.deep.equal({
      bravo: { id: [1, 4, 5, 7, 8] },
      alpha: { id: [2, 3] },
      echo: { id: [4, 5, 6, 7] },
      charlie: { id: [4, 6, 7] },
      delta: { id: [5, 6] }
    });
  });

  it('collect multiple properties', function () {
    const result = groupBy(products, ['color'], ['vendor.address.city', 'available']);
    expect(result).to.deep.equal({
      green: {
        'vendor.address.city': ['Mumbai', 'New York', 'New York', 'Mumbai', 'New York'],
        available: [false, true, true, false, true]
      },
      yellow: {
        'vendor.address.city': ['Mumbai', 'London'],
        available: [false, false]
      },
      red: {
        'vendor.address.city': ['New York'],
        available: [true]
      }
    });
  });

  it('single property without collect option (array output)', function () {
    const result = groupBy(products, ['color'], null, true);
    expect(result).to.be.an('array');
    expect(result).to.deep.equal([
      { key: 'green', values: products.filter(p => p.color === 'green') },
      { key: 'yellow', values: products.filter(p => p.color === 'yellow') },
      { key: 'red', values: products.filter(p => p.color === 'red') }
    ]);
  });

  it('invalid property path', function () {
    expect(() => groupBy(products, ['vendor.address.zip'], ['id'])).to.throw(Error);
  });

  it('items are not cloned', function () {
    const items = [
      { id: 1, geometry: { type: 'Point', coordinates: [1, 2] }, properties: { gender: 'Female', price: 11000 } },
      { id: 2, geometry: { type: 'Point', coordinates: [11, 12] }, properties: { gender: 'Male', price: 10000 } }
    ];
    const result = groupBy(items, ['properties.gender']);
    expect(result['Female'][0] === items[0]).to.be.true;
    expect(result['Male'][0] === items[1]).to.be.true;
  });
});

describe('Edge cases for groupBy', function () {
  it('handles empty properties array', function () {
    const result = groupBy(products, []);
    expect(result).to.deep.equal(products);
  });

  it('handles empty intervals in locationOf', function () {
    const result = groupBy(products, [{ property: 'price', intervals: [] }], ['id']);
    expect(result).to.deep.equal({});
  });

});
