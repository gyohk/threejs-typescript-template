module.exports = function (grunt) {
    grunt.initConfig({
        // package.json の内容を読み込み。他の箇所から参照できるようにする。
        pkg: grunt.file.readJSON('package.json'),
        
        // 設定値の定義。名前が opt であることに特別な理由はない。
        opt: {
            "tsDir": "src",
            "outDir": "dest"
        },
        // grunt-ts に対する設定
        ts: {
            options: {
                target: 'es5', // --target に指定するパラメータ
                module: 'commonjs', // --module に指定するパラメータ
                noImplicitAny: true // --noImplicitAny を使うか使わないか
            },
            // main の動作を定義。名前は main 以外のものでも問題ない。
            // test という名前でテストコードのコンパイル処理を追加することが多い。
            main: {
                src: ['<%= opt.tsDir %>/*.ts'],
                outDir: '<%= opt.outDir %>/js'
            }
        },
        tsd: {
            refresh: {
                options: {
                    // execute a command
                    command: 'reinstall',
                    
                    //optional: always get from HEAD
                    latest: true,
                    
                    // specify config file
                    config: './conf/tsd.json',
                    
                    // experimental: options to pass to tsd.API
                    opts: {
                        // props from tsd.Options
                    }
                }
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("./conf/tslint.json")
            },
            files: {
                src: ['<%= opt.tsDir %>/Main.ts']
            }
        },
        typedoc: {
            build: {
                options: {
                    module: 'commonjs',
                    out: './docs',
                    name: 'my-project',
                    target: 'es5'
                },
                src: ['./src/**/*']
            }
        },
        copy: {
            app: {
                files: [
                    {expand: true, cwd: 'skeleton/', src: ['**'], dest: '<%= opt.outDir %>/'}
                ]
            }
        },
        clean: {
            build: {
                src: [
                    '<%= opt.outDir %>/**/*'
                ]
            }
        },
        connect: {
            server: {
                options: {
                    port: 9001,
                    hostname: 'localhost',
                    base: 'dest',
                    open: {
                        target: 'http://localhost:9001',
                        appName: 'Chrome' // open, Firefox, Chrome
                    },
                    keepalive: true
                    
                }
            }
        }
    });
    
    grunt.registerTask('setup', ['clean', 'tsd', 'copy']);
    grunt.registerTask('default', ['ts', 'tslint']);
    
    // 
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-typedoc');
};