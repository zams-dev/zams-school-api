import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

export const fetchSecrets = async (secretName: string) => {
  const client = new SecretsManagerClient({
    region: "ap-southeast-2",
  });
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName.toString().trim(),
      })
    );
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.log("AWS SECRET MANAGER ERROR: ", JSON.stringify(error));
    throw error;
  }
};
