export default function(eleventyConfig) {
  // Pass through static assets like CSS or images if you create an assets folder
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/media");

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};