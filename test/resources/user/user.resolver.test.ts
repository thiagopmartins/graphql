import { db, chai, app, handleError, expect } from './../../test-utils';

describe('User', () => {

    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => {
                return db.User.create({
                    name: 'Peter Quill',
                    email: 'peter@email.com',
                    password: '1234'
                });
            });
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
                            expect(userList).to.be.an('array').of.length(1);
                            expect(userList[0]).to.not.have.keys(['id', 'photo', 'createdAt', 'updatedAt', 'posts']);
                            expect(userList[0]).to.have.keys(['name', 'email']);
                        }).catch(handleError);
                });

            });

        });

    });

});