import { PostInstance } from './../../../src/models/PostModel';
import * as jwt from 'jsonwebtoken';

import { JWT_SECRET } from './../../../src/utils/utils';
import { UserInstance } from './../../../src/models/UserModel';
import { db, app, expect, chai, handleError } from "../../test-utils";

describe('Post', () => {
    let token: string;
    let userId: number;
    let postId: number;

    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => {
                return db.User.create(
                    {
                        name: 'Rocket',
                        email: 'rocket@email.com',
                        password: '1234'
                    }
                );
            }).then((user: UserInstance) => {
                userId = user.get('id');
                const payload = { sub: userId };
                token = jwt.sign(payload, JWT_SECRET);

                return db.Post.bulkCreate([
                    {
                        title: 'Primeiro Post',
                        content: 'Primeiro Conteudo',
                        author: userId,
                        photo: 'photo'
                    },
                    {
                        title: 'Segundo Post',
                        content: 'Segundo Conteudo',
                        author: userId,
                        photo: 'photo'
                    },
                    {
                        title: 'Terceiro Post',
                        content: 'Terceiro Conteudo',
                        author: userId,
                        photo: 'photo'
                    }
                ]).then((posts: PostInstance[]) => {
                    postId = posts[0].get('id');
                });
            });
    });

    describe('Queries', () => {

        describe('application/json', () => {

            describe('posts', () => {

                it('Deve retornar uma lista de Posts', () => {
                    let body = {
                        query: `
                            query {
                                posts {
                                    title
                                    content
                                    photo
                                }
                            }
                        `
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array');
                            expect(postsList[0]).to.not.have.keys(['id', 'author', 'createdAt', 'updatedAt', 'posts', 'comment']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.equal('Primeiro Post');
                        }).catch(handleError);
                });

            });

            describe('post', () => {

                it('Deve retornar um único Post com seu Author', () => {
                    let body = {
                        query: `
                            query getPost($id: ID!){
                                post(id: $id) {
                                    title
                                    author{
                                        name
                                        email
                                    }
                                    comments{
                                        comment
                                    }
                                }
                            }
                        `,
                        variables: {
                            id: postId
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singlePost = res.body.data.post;
                            expect(res.body.data).to.have.key('post');
                            expect(singlePost).to.be.an('object');
                            expect(singlePost).to.have.keys(['title', 'author', 'comments']);
                            expect(singlePost.title).to.equal('Primeiro Post');
                            expect(singlePost.author).to.be.an('object').with.keys(['name', 'email']);
                            expect(singlePost.author).to.be.an('object').with.not.keys(['id', 'createdAt', 'updatedAt', 'posts']);
                        }).catch(handleError);
                });

            });

        });

        describe('application/graphql', () => {

            describe('posts', () => {
                it('Deve retornar uma lista de Posts', () => {
                    let query = `
                        query {
                            posts {
                                title
                                content
                                photo
                            }
                        }
                    `;

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .then(res => {
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array');
                            expect(postsList[0]).to.not.have.keys(['id', 'author', 'createdAt', 'updatedAt', 'posts', 'comment']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.equal('Primeiro Post');
                        }).catch(handleError);
                });
                it('Deve paginar uma lista de Posts', () => {
                    let query = `
                        query getPostsList($first: Int, $offset: Int) {
                            posts(first: $first, offset: $offset) {
                                title
                                content
                                photo
                            }
                        }
                    `;

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .query({
                            variables: JSON.stringify({
                                first: 2,
                                offset: 1
                            })
                        })
                        .then(res => {
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array').with.length(2);
                            expect(postsList[0]).to.not.have.keys(['id', 'author', 'createdAt', 'updatedAt', 'posts', 'comment']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.equal('Segundo Post');
                        }).catch(handleError);
                });
            });

        });

    });

    describe('Mutations', () => {

        describe('application/json', () => {

            describe('createPost', () => {

                it('Deve criar um novo Post', () => {
                    let body = {
                        query: `
                            mutation createNewPost($input: PostInput!) {
                                createPost(input: $input) {
                                    id
                                    title
                                    content
                                    author {
                                        id
                                        name
                                        email
                                    }
                                }
                            }
                        `,
                        variables: {
                            input: {
                                title: 'Quarto Post',
                                content: 'Quarto Conteudo',
                                photo: 'photo'
                            }
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdPost = res.body.data.createPost;
                            expect(createdPost).to.be.an('object');
                            expect(createdPost).to.have.keys(['id', 'title', 'content', 'author']);
                            expect(createdPost.title).to.equal('Quarto Post');
                            expect(createdPost.content).to.equal('Quarto Conteudo');
                            expect(parseInt(createdPost.author.id)).to.equal(userId);
                        }).catch(handleError);
                });
            });

            describe('updatePost', () => {

                it('Deve atualizar um novo Post existente', () => {
                    let body = {
                        query: `
                            mutation updateExistingPost($id: ID!, $input: PostInput!) {
                                updatePost(id: $id, input: $input) {                            
                                    title
                                    content
                                    photo
                                }
                            }
                        `,
                        variables: {
                            id: postId,
                            input: {
                                title: 'Alterado Post',
                                content: 'Alterado Conteudo',
                                photo: 'photo 2'
                            }
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedPost = res.body.data.updatePost;
                            expect(updatedPost).to.be.an('object');
                            expect(updatedPost).to.have.keys(['title', 'content', 'photo']);
                            expect(updatedPost.title).to.equal('Alterado Post');
                            expect(updatedPost.content).to.equal('Alterado Conteudo');
                            expect(updatedPost.photo).to.equal('photo 2');
                        }).catch(handleError);
                });
            });

            describe('deletePost', () => {

                it('Deve deletar um novo Post existente', () => {
                    let body = {
                        query: `
                            mutation deleteExistingPost($id: ID!) {
                                deletePost(id: $id)
                            }
                        `,
                        variables: {
                            id: postId
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data).to.have.key('deletePost');
                            expect(res.body.data.deletePost).to.be.true;
                        }).catch(handleError);
                });
            });            

        });

    });

});
