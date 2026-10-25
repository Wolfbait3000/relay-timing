// Relay Timing: race length, presets, and pace helpers. Used by every page.
var RelayPace = (function () {
  'use strict';

  var MI_TO_KM = 1.609344;
  var LABELS = {
    'min/mi': 'minutes per mile',
    'min/km': 'minutes per km',
    'mph': 'miles per hour',
    'km/h': 'km per hour'
  };

  // Common race distances, in each unit
  var PRESETS = {
    'marathon': { label: 'Marathon', mi: 26.2, km: 42.195 },
    'half': { label: 'Half marathon', mi: 13.1, km: 21.0975 },
    '5k': { label: '5K', mi: 3.1, km: 5 },
    '10k': { label: '10K', mi: 6.2, km: 10 }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // minutes (decimal) -> "m:ss"
  function mmss(minutes) {
    var total = Math.round(minutes * 60);
    return Math.floor(total / 60) + ':' + pad(total % 60);
  }

  function inKm(d, unit) { return unit === 'km' ? d : d * MI_TO_KM; }
  function inMi(d, unit) { return unit === 'km' ? d / MI_TO_KM : d; }

  // Pace text for one finish time, or '' when there is no race length
  function pace(ms, distance, distUnit, paceUnit) {
    if (!distance || !ms) return '';
    var hours = ms / 3600000;
    if (paceUnit === 'mph') return (inMi(distance, distUnit) / hours).toFixed(1) + ' mph';
    if (paceUnit === 'km/h') return (inKm(distance, distUnit) / hours).toFixed(1) + ' km/h';
    if (paceUnit === 'min/km') return mmss(ms / 60000 / inKm(distance, distUnit)) + ' /km';
    return mmss(ms / 60000 / inMi(distance, distUnit)) + ' /mi';
  }

  // Race length for a preset key ('marathon', 'half', '5k', '10k') in the chosen unit, or null
  function presetLength(key, unit) {
    var p = PRESETS[key];
    return p ? (unit === 'km' ? p.km : p.mi) : null;
  }

  // " (26.2 mi)" for titles, or '' when there is no race length
  function lengthSuffix(distance, unit) {
    if (!distance) return '';
    return ' (' + (+Number(distance).toFixed(2)) + ' ' + (unit === 'km' ? 'km' : 'mi') + ')';
  }

  function label(unit) { return LABELS[unit] || unit; }

  return {
    pace: pace,
    mmss: mmss,
    label: label,
    LABELS: LABELS,
    PRESETS: PRESETS,
    presetLength: presetLength,
    lengthSuffix: lengthSuffix
  };
})();
