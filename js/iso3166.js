const fs = require('fs');
const path = require('path');

// Load country codes from JSON file
const countryData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/code.json'), 'utf8'));

// Generate alpha-2 to alpha-3 mapping
const alpha2ToAlpha3 = countryData.reduce((map, country) => {
    map[country['alpha-2']] = country['alpha-3'];
    return map;
}, {});

/**
 * Convert ISO 3166-1 alpha-2 code to alpha-3 code
 * @param {string} alpha2 - The ISO 3166-1 alpha-2 country code
 * @returns {string|null} The corresponding alpha-3 code, or null if not found
 */
function convertAlpha2ToAlpha3(alpha2) {
    if (!alpha2) return null;
    const upperAlpha2 = alpha2.toUpperCase();
    return alpha2ToAlpha3[upperAlpha2] || null;
}

module.exports = {
    alpha2ToAlpha3,
    convertAlpha2ToAlpha3
}; 