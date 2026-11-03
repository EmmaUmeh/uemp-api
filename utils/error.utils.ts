import { HTTPStatus } from './http.utils';

class HTTPException extends Error {
  statusCode: HTTPStatus;

  constructor(statusCode: HTTPStatus, message: string) {
    super(message);
    this.name = 'HTTPException';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default HTTPException;
