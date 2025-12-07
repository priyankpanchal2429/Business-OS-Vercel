
const now = new Date();
const offset = now.getTimezoneOffset() * 60000;
const localDate = new Date(now.getTime() - offset);
const todayStr = localDate.toISOString().split('T')[0];
const isSunday = localDate.getDay() === 0;

console.log('Now:', now.toISOString());
console.log('Offset (mins):', now.getTimezoneOffset());
console.log('Local Date:', localDate.toISOString());
console.log('Today Str:', todayStr);
console.log('Is Sunday:', isSunday);
