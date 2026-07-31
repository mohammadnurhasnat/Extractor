// =========================================================================
// USER DATABASE FILE (MANUAL USER CREATION DATABASE)
// =========================================================================
// You can easily add new users or clients to this file.
// For each user, the following details are required:
// 1. email: User email address (can be used for login)
// 2. mobileNumber: User mobile number (can be used for login)
// 3. password: User secret password
// 4. name: User full name
//
// 💡 You can add as many new users as you like. Follow the format below.
// =========================================================================

export interface User {
  id: string;
  email: string;
  mobileNumber: string;
  password: string;
  name: string;
  dailyLimit?: number;
  isSuspended?: boolean;
}

export const USERS_DATABASE: User[] = [
  {
    id: "user_mohammad",
    email: "mohammadnurhasnat@gmail.com",
    mobileNumber: "01861186863",
    password: "123", // 💡 Change the password as per your preference
    name: "MOHAMMAD NUR HASNAT"
  },

   {
    id: "user_",
    email: "",
    mobileNumber: "",
    password: "",
    name: ""
  },

  
   {
    id: "user_",
    email: "",
    mobileNumber: "",
    password: "",
    name: ""
  }
  // ➕ To add a new user, uncomment and customize the template below:
  /*
  {
    id: "user_unique_id",
    email: "newuser@example.com",
    mobileNumber: "01500000000",
    password: "userpassword",
    name: "New Custom User"
  }
  */
];
