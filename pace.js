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
  // Each preset has its own unit: marathons in miles, 5K and 10K in kilometers
  var PRESETS = {
    'marathon': { label: 'Marathon', distance: 26.2, unit: 'mi' },
    'half': { label: 'Half marathon', distance: 13.1, unit: 'mi' },
    '5k': { label: '5K', distance: 5, unit: 'km' },
    '10k': { label: '10K', distance: 10, unit: 'km' }
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

  // " (26.2 mi)" for titles, or '' when there is no race length
  function lengthSuffix(distance, unit) {
    if (!distance) return '';
    return ' (' + (+Number(distance).toFixed(2)) + ' ' + (unit === 'km' ? 'km' : 'mi') + ')';
  }

  function label(unit) { return LABELS[unit] || unit; }

  // The events in a race. Older single-event races (flat fields) become one event.
  function eventsOf(s) {
    if (s && Array.isArray(s.events)) return s.events;
    return [{
      id: 'e1',
      name: (s && s.name) || 'Family race',
      racers: (s && s.racers) || [],
      startedAt: (s && s.startedAt) || null,
      stoppedAt: (s && s.stoppedAt) || null,
      finishes: (s && s.finishes) || {},
      distance: (s && s.distance) || null,
      distUnit: (s && s.distUnit) || 'mi',
      distPreset: (s && s.distPreset) || '',
      showPace: !!(s && s.showPace),
      paceUnit: (s && s.paceUnit) || 'min/mi'
    }];
  }

  return {
    pace: pace,
    mmss: mmss,
    label: label,
    LABELS: LABELS,
    PRESETS: PRESETS,
    lengthSuffix: lengthSuffix,
    eventsOf: eventsOf
  };
})();
