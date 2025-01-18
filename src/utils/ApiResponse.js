export default class ApiResponse {
  constructor({ statusCode, data, message = "success", ...props }) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (props) {
      this.path = props.path;
    }
  }
}
