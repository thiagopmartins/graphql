import { AuthUser } from './AuthUserInterface';
import { DataLoaders } from './DataLoadersInterface';
import { DbConnection } from "./DbConnectionInterface";
import { RequestedFields } from './../graphql/ast/RequestedFields';

export interface ResolverContext {

    db?: DbConnection;
    authorization?: string;
    authUser?: AuthUser;
    dataLoaders?: DataLoaders;
    requestedfields?: RequestedFields;

}