import * as graphqlFields from 'graphql-fields';
import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';

import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { DataLoaders } from './../../../interfaces/DataLoadersInterface';
import { handleError, throwError } from './../../../utils/utils';
import { PostInstance } from './../../../models/PostModel';
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';
export const postResolvers = {

    Post: {
        author: (post, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader
                .load({ key: post.get('author'), info })
                .catch(handleError);
        },

        comments: (post, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Comment
                .findAll({
                    where: { post: post.get('id') },
                    limit: first,
                    offset: offset,
                    attributes: context.requestedfields.getFields(info)
                }).catch(handleError);
        },
    },

    Query: {
        posts: (parent, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Post
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: context.requestedfields.getFields(info, { keep: ['id'], exclude: ['comments'] })
                }).catch(handleError);
        },

        post: (parent, { id }, context: ResolverContext, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return context.db.Post
                .findById(id, {
                    attributes: context.requestedfields.getFields(info, { keep: ['id'], exclude: ['comments'] })
                })
                .then((post: PostInstance) => {
                    throwError(!post, `Post id ${id} não foi encontrado!`);
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
                        throwError(!post, `Post id ${id} não foi encontrado!`);
                        throwError(post.get('author') != authUser.id, `Não autorizado, somente é possível alterar posts que você criou!`);
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
                        throwError(!post, `Post id ${id} não foi encontrado!`);
                        throwError(post.get('author') != authUser.id, `Não autorizado, somente é possível deletar posts que você criou!`);
                        return post.destroy({ transaction: t })
                            .then(post => !!post);
                    });
            }).catch(handleError);
        })
    }
}