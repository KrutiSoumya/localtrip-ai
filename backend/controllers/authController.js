const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const users = []; // temporary (we’ll use DB later)

exports.register = async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ email, password: hashedPassword });

    res.json({ message: "User registered successfully" });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.json({ token });
};