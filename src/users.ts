// =========================================================================
// 🇧🇩 ইউজার ডাটাবেস ফাইল (MANUAL USER CREATION DATABASE)
// =========================================================================
// আপনি খুব সহজেই এই ফাইলে নতুন ইউজার বা গ্রাহক যোগ করতে পারবেন।
// প্রতিটা ইউজারের জন্য নিচের তথ্যগুলো দেওয়া আবশ্যক:
// 1. email: ইউজারের ইমেইল এড্রেস (লগইনের জন্য ব্যবহার করা যাবে)
// 2. mobileNumber: ইউজারের মোবাইল নাম্বার (লগইনের জন্য ব্যবহার করা যাবে)
// 3. password: ইউজারের গোপন পাসওয়ার্ড
// 4. name: ইউজারের নাম
//
// 💡 আপনি আপনার পছন্দমতো নতুন ইউজার এই তালিকায় যুক্ত করতে পারবেন। নিচের ফরম্যাটটি ফলো করুন।
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
    password: "123", // 💡 পাসওয়ার্ড পরিবর্তন করে আপনার পছন্দমতো দিন
    name: "MOHAMMAD NUR HASNAT"
  },

   {
    id: "user_badsha_badhon",
    email: "badhon@gmail.com",
    mobileNumber: "01315002034",
    password: "12345678",
    name: "Badsha Badhon"
  }
  // ➕ নতুন ইউজার যোগ করতে চাইলে নিচের ব্র্যাকেটের ভেতরের অংশটি আন-কমেন্ট করে কপি-পেস্ট করে বসিয়ে দিন:
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
