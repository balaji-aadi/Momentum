try {
  console.log('Requiring buffer-equal-constant-time...');
  require('buffer-equal-constant-time');
  console.log('Success!');
} catch (e) {
  console.error('Error requiring buffer-equal-constant-time:', e);
}

try {
  console.log('Requiring jwa...');
  require('jwa');
  console.log('Success!');
} catch (e) {
  console.error('Error requiring jwa:', e);
}
