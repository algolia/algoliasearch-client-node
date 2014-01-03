var jsFiles = [ 'algoliasearch-node.js' ];

module.exports = function(grunt) {
  grunt.initConfig({
    version: grunt.file.readJSON('package.json').version,

    buildDir: 'dist',

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      src: jsFiles,
      tests: ['test/*.js'],
      gruntfile: ['Gruntfile.js']
    }

  });

  // aliases
  // -------

  grunt.registerTask('lint', 'jshint');

  // load tasks
  // ----------

  grunt.loadNpmTasks('grunt-contrib-jshint');
};
