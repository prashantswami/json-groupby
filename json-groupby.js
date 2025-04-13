'use strict';
const propertyAt = require('./property-value.js');

function groupBy(items, properties, collect, asArray = false) {
  // TODO argument validation
  if (arguments.length < 2) return items;
  let groups = _groupBy(items, properties);

  // Collect other properties' values in an array
  if (collect && collect.length > 0) {
    groups = collectProperties(groups, collect);
  }

  // Convert groups to array if asArray is true
  if (asArray) {
    groups = convertToArray(groups);
  }

  return groups;
}

function _groupBy(items, properties) {
  if (properties.length === 0) {
    return items; // Return the original items if no properties are provided
  }

  let group = {};
  if (typeof properties[0] === 'string') {
    group = groupByCategory(items, properties[0]);
  } else {
    group = groupByRange(items, properties[0]);
  }

  properties = properties.slice(1);
  if (properties.length > 0) {
    for (const key in group) {
      group[key] = _groupBy(group[key], properties);
    }
  }
  return group;
}

function groupByCategory(arr, prop) {
  return arr.reduce((group, item) => {
    const tags = propertyAt(item, prop);
    tags.forEach(tag => {
      group[tag] = group[tag] || [];
      group[tag].push(item);
    });
    return group;
  }, {});
}

function groupByRange(arr, lookup) {
  if (!lookup.intervals || lookup.intervals.length === 0) {
    return {}; // Return an empty object if intervals are not provided
  }

  return arr.reduce((group, item) => {
    const val = propertyAt(item, lookup.property);
    let ind = locationOf(val, lookup.intervals);
    if (ind === lookup.intervals.length - 1) ind--;
    const tag = lookup.labels ? lookup.labels[ind] : ind;
    group[tag] = group[tag] || [];
    group[tag].push(item);
    return group;
  }, {});
}

// Collect the properties in an array
function collectProperties(groups, properties) {
  const collection = {};
  for (const key in groups) {
    if (Array.isArray(groups[key])) {
      collection[key] = groups[key].reduce((coll, item) => {
        properties.forEach(prop => {
          if (!coll[prop]) coll[prop] = [];
          coll[prop] = coll[prop].concat(propertyAt(item, prop));
        });
        return coll;
      }, {});
    } else {
      collection[key] = collectProperties(groups[key], properties);
    }
  }
  return collection;
}

// Convert grouped object to array
function convertToArray(groups) {
  return Object.keys(groups).map(key => ({
    key: key,
    values: Array.isArray(groups[key])
      ? groups[key]
      : Object.keys(groups[key]).reduce((acc, subKey) => {
          acc[subKey] = groups[key][subKey];
          return acc;
        }, {})
  }));
}

// Similar to Array.findIndex but more efficient
// http://stackoverflow.com/q/1344500/713573
function locationOf(element, array, start = 0, end = array.length) {
  const pivot = Math.floor(start + (end - start) / 2);
  if (end - start <= 1 || array[pivot] === element) return pivot;
  if (array[pivot] < element) {
    return locationOf(element, array, pivot, end);
  } else {
    return locationOf(element, array, start, pivot);
  }
}

module.exports = groupBy;
