import json
import urllib
from jose import jwt

STATUS_CODE_UNAUTHORIZED = 401

class CognitoAuthenticator:
    def __init__(self, region, user_pool_id, app_client_id):
        self.claims = None
        self.region = region
        self.user_pool_id = user_pool_id
        self.app_client_id = app_client_id

    def get_claims(self):
        return self.claims
    
    def get_cognito_jwks(self):
        url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read())

    def jwt_decode(self, event):
        jwks = self.get_cognito_jwks()

        # Decode the JWT token
        token = event['headers']['authorization'].split(' ')[1]
        decode_success = False
        try:
            self.claims = jwt.decode(
                token,
                jwks,
                algorithms=['RS256'],
                audience=self.app_client_id
            )

            decode_success = True
        except jwt.ExpiredSignatureError:
            print("トークンの有効期限が切れています")
        except jwt.InvalidAudienceError:
            print("クレームが想定と違います")
        except jwt.InvalidSignatureError:
            print("署名の検証に失敗しました")
        except jwt.DecodeError:
            print("トークンの構造が不正です")
        except jwt.PyJWTError as e:
            print(f"その他のJWTエラー: {str(e)}")
        
        return decode_success