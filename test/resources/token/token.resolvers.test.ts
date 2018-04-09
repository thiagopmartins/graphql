import { db, handleError, app, chai, expect } from "../../test-utils";

describe('Token', () => {
    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => {
                return db.User.create(
                    {
                        name: 'Peter Quill',
                        email: 'peter@email.com',
                        password: '1234'
                    }
                );
            }).catch(handleError);
    });

    describe('Mutations', () => {

        describe('application/json', () => {

            describe('createToken', () => {

                it('Deve retornar um novo Token válido', () => {

                    let body = {

                        query: `
                            mutation createNewToken($email: String!, $password: String!) {
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'peter@email.com',
                            password: '1234'
                        }

                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data).to.have.key('createToken');
                            expect(res.body.data.createToken).to.have.key('token');
                            expect(res.body.data.createToken.token).to.be.string;
                            expect(res.body.errors).to.be.undefined;
                        }).catch(handleError);
                });

                it('Deve retornar um erro se o password for incorreto', () => {

                    let body = {

                        query: `
                            mutation createNewToken($email: String!, $password: String!) {
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'peter@email.com',
                            password: 'PASSWORD_INCORRETO'
                        }

                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.data).to.have.key('createToken');
                            expect(res.body.data.createToken).to.be.null;
                            expect(res.body.errors).to.be.an('array').with.length(1);
                            expect(res.body.errors[0].message).to.equal('Email ou senha estão incorretos.');
                        }).catch(handleError);
                });

                it('Deve retornar um erro se o email for incorreto', () => {

                    let body = {

                        query: `
                            mutation createNewToken($email: String!, $password: String!) {
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'EMAIL_INCORRETO@email.com)',
                            password: '1234'
                        }

                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.data).to.have.key('createToken');
                            expect(res.body.data.createToken).to.be.null;
                            expect(res.body.errors).to.be.an('array').with.length(1);
                            expect(res.body.errors[0].message).to.equal('Email ou senha estão incorretos.');
                        }).catch(handleError);
                });                

            });

        });

    });

});