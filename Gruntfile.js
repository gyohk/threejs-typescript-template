module.exports = function (grunt) {
    grunt.initConfig({
        // package.json �̓��e��ǂݍ��݁B���̉ӏ�����Q�Ƃł���悤�ɂ���B
        pkg: grunt.file.readJSON('package.json'),
        
        // �ݒ�l�̒�`�B���O�� opt �ł��邱�Ƃɓ��ʂȗ��R�͂Ȃ��B
        opt: {
            "tsDir": "src",
            "outDir": "dest"
        },
        // grunt-ts �ɑ΂���ݒ�
        ts: {
            options: {
                target: 'es5', // --target �Ɏw�肷��p�����[�^
                module: 'commonjs', // --module �Ɏw�肷��p�����[�^
                noImplicitAny: true // --noImplicitAny ���g�����g��Ȃ���
            },
            // main �̓�����`�B���O�� main �ȊO�̂��̂ł����Ȃ��B
            // test �Ƃ������O�Ńe�X�g�R�[�h�̃R���p�C��������ǉ����邱�Ƃ������B
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