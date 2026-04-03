import { Coordinates, CalculationMethod, PrayerTimes, Madhab, SunnahTimes } from 'adhan';

// Default coordinates for Makkah al-Mukarramah
export const MAKKAH_COORDS = { latitude: 21.3891, longitude: 39.8579 };

export function calculatePrayerTimes(latitude, longitude, date = new Date()) {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.UmmAlQura();
  params.madhab = Madhab.Shafi;

  const prayerTimes = new PrayerTimes(coordinates, date, params);
  const sunnah = new SunnahTimes(prayerTimes);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    middleOfTheNight: sunnah.middleOfTheNight,
    lastThirdOfTheNight: sunnah.lastThirdOfTheNight,
  };
}

export function getCurrentAndNextPrayer(prayerTimes, now = new Date()) {
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const times = prayers.map(name => ({ name, time: prayerTimes[name] }));

  let current = null;
  let next = null;

  for (let i = 0; i < times.length; i++) {
    if (times[i].time <= now) {
      current = times[i];
      next = times[i + 1] || times[0]; // wrap to fajr
    }
  }

  if (!current) {
    // Before fajr
    current = { name: 'isha', time: null };
    next = times[0];
  }

  return { current, next };
}

export const PRAYER_LABELS = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const PRAYER_RAKAAT = {
  fajr: { fard: 2, sunnah_before: 2, sunnah_after: 0 },
  dhuhr: { fard: 4, sunnah_before: 4, sunnah_after: 2 },
  asr: { fard: 4, sunnah_before: 0, sunnah_after: 0 },
  maghrib: { fard: 3, sunnah_before: 0, sunnah_after: 2 },
  isha: { fard: 4, sunnah_before: 0, sunnah_after: 2, witr: 3 },
};
