import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const user = {
    userId: '03855108-8666-4e7f-80f5-40c0bb4d824a',
    tenantId: '0ff32208-991d-4382-9a93-28885dfe9d13',
    roles: ['BUSINESS_ADMIN'],
    isImpersonating: true
};
const token = jwt.sign(user, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
console.log(token);
//# sourceMappingURL=gen_token.js.map