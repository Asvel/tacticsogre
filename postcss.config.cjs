module.exports = {
  plugins: [
    require('postcss-preset-env')({ features: { 'case-insensitive-attributes': false } }),
    process.env.NODE_ENV !== 'development' && require('cssnano'),
  ],
};
