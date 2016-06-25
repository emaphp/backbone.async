module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            jquery: {
                src: 'node_modules/jquery/dist/jquery.js',
                dest: 'test/lib/jquery.js'
            },

            underscore: {
                src: 'node_modules/underscore/underscore.js',
                dest: 'test/lib/underscore.js'
            },

            backbone: {
                src: 'node_modules/backbone/backbone.js',
                dest: 'test/lib/backbone.js'
            },

            mocha: {
                files: [
                    {
                        src: 'node_modules/mocha/mocha.js',
                        dest: 'test/lib/mocha.js'
                    },
                    {
                        src: 'node_modules/mocha/mocha.css',
                        dest: 'test/lib/mocha.css'
                    }
                ]
            },

            chai: {
                src: 'node_modules/chai/chai.js',
                dest: 'test/lib/chai.js'
            },

            promise: {
                src: 'node_modules/promise-polyfill/promise.js',
                dest: 'test/lib/promise.js'
            }
        },

        jshint: {
            files: ['Gruntfile.js', 'dist/<%= pkg.name %>.js', 'test/*.js'],

            options: {
                globals: {
                    'Backbone': true,
                    _: true
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    //copies required libraries for testing
    grunt.registerTask('vendor', ['copy:jquery', 'copy:underscore', 'copy:backbone', 'copy:mocha', 'copy:chai', 'copy:promise']);

    //applies jshint to project files
    grunt.registerTask('test', ['jshint']);

    //minifies library
    grunt.registerTask('release', ['jshint', 'uglify:dist']);
};
