import { Component } from "./component";
import { Organization } from "./organization";
import { User } from "./user";

export type LambdaAction = 'query' | 'put' | 'update' | 'delete';

export type LambdaPayload = Record<string, any>;

export interface LambdaResponse {
  result: 'success' | 'failure';
  message: string;
}

export interface ComponentsCRUDResponse extends LambdaResponse {
  components: Component[];
}

export interface OrganizationIdGetResponse extends LambdaResponse {
  organization: Organization;
}

export interface UserRegisterResponse extends LambdaResponse {
  user: User;
}
