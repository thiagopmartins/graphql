import { JWT_SECRET } from './../../../src/utils/utils';
import * as jwt from 'jsonwebtoken';

import { UserInstance } from './../../../src/models/UserModel';
import { db, chai, app, handleError, expect } from './../../test-utils';

describe('User', () => {

    let token: string;
    let userId: number;

    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => {
                return db.User.bulkCreate([
                    {
                        name: 'Peter Quill',
                        email: 'peter@email.com',
                        password: '1234'
                    },
                    {
                        name: 'Gamora',
                        email: 'Gamora@email.com',
                        password: '1234'
                    },
                    {
                        name: 'Groot',
                        email: 'Groot@email.com',
                        password: '1234'
                    }
                ]);
            }).then((users: UserInstance[]) => {
                userId = users[0].get('id');
                const payload = { sub: userId };
                token = jwt.sign(payload, JWT_SECRET);
            })
    });

    describe('Queries', () => {

        describe('application/json', () => {

            describe('users', () => {

                it('deve retornar uma lista de usuarios', () => {

                    let body = {
                        query: `
                            query {
                                users {
                                    name
                                    email
                                }
                            }
                        `
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const userList = res.body.data.users;
                            expect(res.body.data).to.be.an('object');
                            expect(userList).to.be.an('array');
                            expect(userList[0]).to.not.have.keys(['id', 'photo', 'createdAt', 'updatedAt', 'posts']);
                            expect(userList[0]).to.have.keys(['name', 'email']);
                        }).catch(handleError);
                });
                it('deve paginar uma lista de usuarios', () => {

                    let body = {
                        query: `
                            query getUsersList($first: Int, $offset: Int){
                                users(first: $first, offset: $offset) {
                                    name
                                    email
                                    createdAt
                                }
                            }
                        `,
                        variables: {
                            first: 2,
                            offset: 1
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const userList = res.body.data.users;
                            expect(res.body.data).to.be.an('object');
                            expect(userList).to.be.an('array').of.length(2);
                            expect(userList[0]).to.not.have.keys(['id', 'photo', 'updatedAt', 'posts']);
                            expect(userList[0]).to.have.keys(['name', 'email', 'createdAt']);
                        }).catch(handleError);
                });

            });

            describe('user', () => {
                it('deve retornar um usuário único', () => {

                    let body = {
                        query: `
                            query getSingleUser($id: ID!){
                                user(id: $id) {
                                    id
                                    name
                                    email
                                    posts {
                                        title
                                    }
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user;
                            expect(res.body.data).to.be.an('object');
                            expect(singleUser).to.be.an('object');
                            expect(singleUser).to.have.keys(['id', 'name', 'email', 'posts']);
                            expect(singleUser.name).to.equal('Peter Quill');
                            expect(singleUser.email).to.equal('peter@email.com');

                        }).catch(handleError);
                });
                it('deve retornar somente o atributo \'name\'', () => {

                    let body = {
                        query: `
                            query getSingleUser($id: ID!){
                                user(id: $id) {
                                    name
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user;
                            expect(res.body.data).to.be.an('object');
                            expect(singleUser).to.be.an('object');
                            expect(singleUser).to.have.key('name');
                            expect(singleUser.name).to.equal('Peter Quill');
                            expect(singleUser.email).to.be.undefined;

                        }).catch(handleError);
                });
                it('deve retornar um erro se o usuário não existir', () => {

                    let body = {
                        query: `
                            query getSingleUser($id: ID!){
                                user(id: $id) {
                                    name
                                }
                            }
                        `,
                        variables: {
                            id: -1
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user;
                            expect(res.body.data.user).to.be.null;
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors[0].message).to.equal('Error: Usuário ID -1 não existe!');
                        }).catch(handleError);
                });
            });

        });

    });

    describe('Mutations', () => {

        describe('application/json', () => {

            describe('createUser', () => {

                it('Deve criar um usuário', () => {

                    let body = {
                        query: `
                            mutation createNewUser($input: UserCreateInput!) {
                                createUser(input: $input) {
                                    id
                                    name
                                    email
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'Thiago',
                                email: 'thiago@email.com',
                                password: '1234'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdUser = res.body.data.createUser;
                            expect(createdUser).to.be.an('object');
                            expect(createdUser.name).to.equal('Thiago');
                            expect(createdUser.email).to.equal('thiago@email.com');
                            expect(parseInt(createdUser.id)).to.be.a('number');
                        }).catch(handleError);
                });

            });
            describe('updateUser', () => {

                it('Deve atualizar um usuário existente', () => {

                    let body = {
                        query: `
                            mutation updateExistingUser($input: UserUpdateInput!) {
                                updateUser(input: $input) {
                                    name
                                    email
                                    photo
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'Star Lord',
                                email: 'peter@email.com',
                                photo: 'some_photo'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedUser = res.body.data.updateUser;
                            expect(updatedUser).to.be.an('object');
                            expect(updatedUser.name).to.equal('Star Lord');
                            expect(updatedUser.email).to.equal('peter@email.com');
                            expect(updatedUser.photo).to.not.be.null;
                            expect(updatedUser.id).to.be.undefined;
                        }).catch(handleError);
                });

                it('Deve bloquear a operação se o token for inválido', () => {

                    let body = {
                        query: `
                            mutation updateExistingUser($input: UserUpdateInput!) {
                                updateUser(input: $input) {
                                    name
                                    email
                                    photo
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'Star Lord',
                                email: 'peter@email.com',
                                photo: 'some_photo'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer INVALID_TOKEN`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.updateUser).to.be.null;
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body.errors[0].message).to.equal('JsonWebTokenError: jwt malformed');
                        }).catch(handleError);
                });

            });
            describe('updateUserPassword', () => {
                it('Deve atualizar o password de um usuário existente', () => {

                    let body = {
                        query: `
                            mutation updateUserPassword($input: UserUpdatePasswordInput!) {
                                updateUserPassword(input: $input)
                            }
                        `,
                        variables: {
                            input: {
                                password: 'peter123'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.updateUserPassword).to.be.true;
                        }).catch(handleError);
                });
            });
            describe('deleteUser', () => {
                it('Deve deletar um usuário existente', () => {

                    let body = {
                        query: `
                                mutation {
                                    deleteUser
                                }
                            `
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.deleteUser).to.be.true;
                        }).catch(handleError);
                });
            });
        });

    });

});