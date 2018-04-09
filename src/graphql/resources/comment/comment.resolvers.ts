import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { handleError, throwError } from './../../../utils/utils';
import { CommentInstance } from './../../../models/CommentModel';
import { DbConnection } from './../../../interfaces/DbConnectionInterface';
import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { compose } from '../../composable/composable.resolver';
import { authResolvers } from '../../composable/auth.resolver';
import { DataLoaders } from '../../../interfaces/DataLoadersInterface';
import { RequestedFields } from '../../ast/RequestedFields';
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';
export const commentResolvers = {

    Comment: {

        user: (comment, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader
                .load({ key: comment.get('user'), info })
                .catch(handleError);
        },

        post: (comment, args, { db, dataloaders: { postLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return postLoader
                .load({ key: comment.get('post'), info })
                .catch(handleError);
        }
    },

    Query: {

        commentsByPost: (parent, { postId, first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            postId = parseInt(postId);
            return context.db.Comment
                .findAll({
                    where: { post: postId },
                    limit: first,
                    offset: offset,
                    attributes: context.requestedfields.getFields(info)
                })
                .catch(handleError);
        }
    },

    Mutation: {

        createComment: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            input.user = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .create(input, { transaction: t });
            })
                .catch(handleError);
        }),

        updateComment: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .findById(id)
                    .then((comment: CommentInstance) => {
                        throwError(!comment, `Comentario id ${id} não foi encontrado!`);
                        throwError(comment.get('user') != authUser.id, `Não autorizado, somente é possível alterar comentários que você criou!`);
                        input.user = authUser.id;
                        return comment.update(input, { transaction: t });
                    });
            }).catch(handleError);
        }),

        deleteComment: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment
                    .findById(id)
                    .then((comment: CommentInstance) => {
                        throwError(!comment, `Comentario id ${id} não foi encontrado!`);
                        throwError(comment.get('user') != authUser.id, `Não autorizado, somente é possível deletar comentários que você criou!`);
                        return comment.destroy({ transaction: t })
                            .then(comment => !!comment);
                    });
            }).catch(handleError);
        })
    }
};