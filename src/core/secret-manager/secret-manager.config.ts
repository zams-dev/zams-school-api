import { ConfigService } from "@nestjs/config";
import { fetchSecrets } from "./fetch-screts";

export default async () => {
  const secretName = process.env.AWS_SECRET_NAME;

  const secrets = await fetchSecrets(secretName.toString().trim());
  return secrets;
};
