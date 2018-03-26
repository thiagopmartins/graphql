import { ModelsInterface } from './ModelsInterface';
import * as Sequelize from 'sequelize';

export interface DbConnection extends ModelsInterface {

    sequelize: Sequelize.Sequelize;

}