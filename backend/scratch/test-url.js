const connectionString = "mysql://root:@localhost:3306/medisynex";
const dbUrl = new URL(connectionString);
console.log({
  protocol: dbUrl.protocol,
  username: dbUrl.username,
  password: dbUrl.password,
  hostname: dbUrl.hostname,
  port: dbUrl.port,
  pathname: dbUrl.pathname
});
