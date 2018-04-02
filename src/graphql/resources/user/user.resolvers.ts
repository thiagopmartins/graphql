import { handleError, throwError } from './../../../utils/utils';
import { Transaction } from "sequelize";
import { GraphQLResolveInfo } from "graphql";

import { authResolvers } from './../../composable/auth.resolver';
import { AuthUser } from './../../../interfaces/AuthUserInterface';
import { compose } from '../../composable/composable.resolver';
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { RequestedFields } from './../../ast/RequestedFields';
import { UserInstance } from "../../../models/UserModel";

export const userResolvers = {

    // ! PARAMETROS PADRÃO PARA OS RESOLVERS: (parent, args, context, info)
    User: {

        posts: (user, { first = 10, offset = 0 }, { db, requestedfields }: { db: DbConnection, requestedfields: RequestedFields }, info: GraphQLResolveInfo) => {
            return db.Post
                .findAll({
                    where: { author: user.get('id') },
                    limit: first,
                    offset: offset,
                    attributes: requestedfields.getFields(info, { keep: ['id'], exclude: ['comments'] })
                }).catch(handleError);
        }
    },

    Query: {

        users: (parent, { first = 10, offset = 0 }, { db, requestedfields }: { db: DbConnection, requestedfields: RequestedFields }, info: GraphQLResolveInfo) => {
            return db.User
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: requestedfields.getFields(info, { keep: ['id'], exclude: ['posts'] })
                }).catch(handleError);
        },

        user: (parent, { id }, { db, requestedfields }: { db: DbConnection, requestedfields: RequestedFields }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.User
                .findById(id, {
                    attributes: requestedfields.getFields(info, { keep: ['id'], exclude: ['posts'] })
                })
                .then((user: UserInstance) => {
                    throwError(!user, `Usuário ID ${id} não existe!`);
                    return user;
                })
                .catch(handleError);
        },

        currentUser: compose(...authResolvers)((parent, args, { db, authUser, requestedfields }: { db: DbConnection, authUser: AuthUser, requestedfields: RequestedFields }, info: GraphQLResolveInfo) => {
            return db.User
                .findById(authUser.id, {
                    attributes: requestedfields.getFields(info, { keep: ['id'], exclude: ['posts'] })
                })
                .then((user: UserInstance) => {
                    throwError(!user, `Usuário ID ${authUser.id} não existe!`);
                    return user;
                }).catch(handleError);
        })
    },

    Mutation: {

        createUser: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .create(input, { transaction: t });
            }).catch(handleError);
        },

        updateUser: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `Usuário ID ${authUser.id} não existe!`);
                        return user.update(input, { transaction: t });
                    })
            }).catch(handleError);
        }),

        updateUserPassword: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `Usuário ID ${authUser.id} não existe!`);
                        return user.update(input, { transaction: t })
                            .then((user: UserInstance) => !!user);
                    })
            }).catch(handleError);
        }),

        deleteUser: compose(...authResolvers)((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User
                    .findById(authUser.id)
                    .then((user: UserInstance) => {
                        throwError(!user, `Usuário ID ${authUser.id} não existe!`);
                        return user.destroy({ transaction: t })
                            .then(user => !!user);
                    })
            }).catch(handleError);
        }),
    }

};