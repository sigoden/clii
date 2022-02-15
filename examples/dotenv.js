dotenv();

export default function () {
  console.log(process.env.FOO);
  console.log(process.env.BAR);
}
