const express = require('express');
const connectToMongoose = require('./apis/v1/db/db');
const app = express();
const cors = require('cors');
const fs = require('fs')
app.use(cors());


connectToMongoose();
app.use('/uploads', express.static('uploads'));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/api/v1", require('./apis/v1/routers/auth'));
app.use("/api/v1", require('./apis/v1/routers/users'));
app.use("/api/v1", require('./apis/v1/routers/guide'));
app.use("/api/v1", require('./apis/v1/routers/step'));
app.use("/api/v1", require('./apis/v1/routers/contents'));
app.use("/api/v1", require('./apis/v1/routers/upload'));
app.use("/api/v1", require('./apis/v1/routers/text-to-speech'));


//encryted APIs
app.use("/api/v2", require('./apis/v2/routers/auth'));
app.use("/api/v2", require('./apis/v2/routers/upload'));
app.use("/api/v2", require('./apis/v2/routers/guides'));








app.listen(3000, () => {
  console.log('Server is running on port 3001');
});
