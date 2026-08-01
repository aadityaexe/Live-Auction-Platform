import monguse from "mongoose";

const userSchema = new monguse.Schema(
  {
    name: { string, required: true },
    email: { string, required: true, unique: true },
    password: { string, required: true },
    image: { string, required: true },
    phone: { number, required: true },
    dob: { date, required: true },
  },
  {
    timestamps: true,
  },
);

export default monguse.model("User", userSchema);
