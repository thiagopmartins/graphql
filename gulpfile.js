const gulp = require('gulp');
const clean = require('gulp-clean');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

//TODO Compila os arquivos ts para o diretório dist
gulp.task('scripts', ['static'], () => {

    const tsResult = tsProject.src()
        .pipe(tsProject());

    return tsResult.js
        .pipe(gulp.dest('dist'));
});

//TODO Compila os arquivos static para o diretório dist
gulp.task('static', ['clean'], () => {

    return gulp
        .src(['src/**/*.json'])
        .pipe(gulp.dest('dist'));

});

//TODO Limpa o diretório dist
gulp.task('clean', () => {

    return gulp
        .src('dist')
        .pipe(clean());

});

//TODO Chama as outras tarefas em ordem
gulp.task('build', ['scripts']);

//TODO Ouve alterações no código
gulp.task('watch', ['build'], () => {

    return gulp.watch(['src/**/*.ts', 'scr/**/*.json'], ['build']);

});

gulp.task('default', ['watch']);