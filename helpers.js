const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (email === database[user].email) {
      return database[user].id;
    }
  }
  return false;
};

const checkEmail = (email, database) => {
  for (const user in database) {
    if (email === database[user].email) {
      return true;
    }
  }
  return false;
};


module.exports = {
  getUserByEmail,
  checkEmail
};

