import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { handleError, throwError } from './../../../utils/utils';
import { Transaction } from 'sequelize';
import { PostInstance } from './../../../models/PostModel';
import { GraphQLResolveInfo } from 'graphql';
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { compose } from '../../composable/composable.resolver';
import { authResolvers } from '../../composable/auth.resolver';
export const postResolvers = {

    Post: {
        author: (post, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.User
                .findById(post.get('author'))
                .catch(handleError);

        },

        comments: (post, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.Comment
                .findAll({
                    where: { post: post.get('id') },
                    limit: first,
                    offset: offset
                }).catch(handleError);
        },
    },

    Query: {
        posts: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.Post
                .findAll({
                    limit: first,
                    offset: offset
                }).catch(handleError);
        },

        post: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.Post
                .findById(id)
                .then((post: PostInstance) => {
                    throwError (!post, `Post id ${id} não foi encontrado!`);
                    return post;
                })
                .catch(handleError);
        },
    },

    Mutation: {

        createPost: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            input.author = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .create(input, { transaction: t });
            }).catch(handleError);
        }),

        updatePost: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .findById(id)
                    .then((post: PostInstance) => {
                        throwError (!post, `Post id ${id} não foi encontrado!`);
                        throwError (post.get('author') != authUser.id, `Não autorizado, somente é possível alterar posts que você criou!`);
                        input.author = authUser.id;
                        return post.update(input, { transaction: t });
                    });
            }).catch(handleError);
        }),

        deletePost: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post
                    .findById(id)
                    .then((post: PostInstance) => {
                        throwError (!post, `Post id ${id} não foi encontrado!`);
                        throwError (post.get('author') != authUser.id, `Não autorizado, somente é possível deletar posts que você criou!`);
                        return post.destroy({ transaction: t })
                            .then(post => !!post);
                    });
            }).catch(handleError);
        })
    }
}