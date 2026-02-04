import os
from dotenv import load_dotenv

# Load variables from a .env file if it exists
load_dotenv()

class Settings:
    # Firebase Credentials (Mapped from your new JSON)
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "vision-match-123")
    FIREBASE_PRIVATE_KEY_ID: str = os.getenv("FIREBASE_PRIVATE_KEY_ID", "5d309bda455ffe8549c6d4e0a792a0db32f9972a")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY","-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8vnp9aLM1zxNY\n3ycf2j0Dq7tjhOj3gRmVGqVXu2Xfa5wwdJZifmOU19ybk4R43pxQxYfGpnfK3kmT\nCN5gYiTDQNmnanLV8qET6Qxb/CIp+amtztr7t42lI+zMW1lz/7zzAwZhvUG2cMGu\niypKLxUOHJ4nemMnS2TyLJcqdLCz99uiQoxORCdCbAwSJ9uqx5nDOXBAxjlFfaT+\nZP5X+HjvqYFzNgoxy5/Qy/lcY9Rz3vmXmF1IiotDtB3WBxpIqsz5P5x/F8dy+Paq\ncdSgLpkPLG50lrRIpxTUVjA+szxPXHm8GnBLh32pdFYKXK9mhUeya9fDbZ9wgOD2\nAowoOYyJAgMBAAECggEADvRGjzYi8NH51fJETs1DRU2veKiYrrd/V+V3ETbrUOLd\nSqeKHL6n1CywMXFkLxFwMCQeaFpbJmsrSCeNOvS7te6m8BFKjPH+2i1+SbF14X6C\n957qkcQOyHVKtzxLn5m1Fkn4kPjmQna3mcUz8hG96NLSow0a2wupsVhgF8CMGY4Y\nN0kJ+ND2mZzeZP+TuTKc6nhUu6e17Pf/IwaIkAtiQtEbAWndalwbf1CMEtMCLyWa\n+fK2GPxUqkOrQaql/SXWRSOI7B9FBf+K9kRw9m/trbBzqCZ9my29ZD/jbZfNMB3F\npfPPnvRdHw8xBUeSDOUNScvxR/8wsF94zV1cpQ0lCQKBgQD3wQw7WtsqZo/NX01n\nGj9gQOO8Fk7ds9kMFvcV/5Cp/7x0Km3bHEUxLZzsW4n4M5aOMhks2IAmiG3Y9iH5\nRFODIw9nBFxsPLH6eRjLNTYZEbINGfC+Lhw7VkBiWz9htyNJzGyiSKMTC2EufT5N\nfiRl6zXIHSzaSsANVSfTbaEnTQKBgQDDBqT2KyYpxOMfRnbttdyZZa2fqDBVmDQ1\nXMi3oZjGUvrjy7vw2qIGDB7ionuxf6u7aSkbGtm5n+uNdH7ehM47tn8v/8nFGWhj\nnOFFbJpggU4KdFoZBpUsw4/3LgKklqXPlt0U5PEuklNXcw7iqUqplNzSJfiO79u8\noxbrMZI0LQKBgBaeMh6tEbsSN+iY3bke5VBFPEUsiDCnPZZj9lS0yyEp7qtwQC0z\nrIFr15qgVL0rAICkxDWa4kAiTlzzQ3C9Mx6SsdJGzKU4+UqTiZbrma+6NNYLWzYR\ngZRNMH2KNQQXswoGtpguJ20SqeGTn391l58SVQua1kBreJL/Bi7AIGk1AoGBAIrw\n1uFSCFRFopGLf/sGT20xlSpjhlvUnY1O1uiMRe00/O0BHpoPCNNKG07W90yTamOQ\nHerjjC3EkuoqDqC0+MBt2dr2Xmb/HPGquIrfPnR2aoTkM7QUjn5frNcqflOHyAVG\ns6bJHFJTiPCKVhaBCWIbXd6Rkq0ykNepURCqNkDZAoGAb0lU7rNpE837qj0l5lod\nnkH0u3YQNn7qdUwAuYeJ8Oy9QRB8Ot+yfJtZdKtRE63wgZe04QXQa1g+4JPGD9i5\n8+0HHsbf1HBM45JF4dJQh75IiUr7KpabLM+EUeNPtQ7fbThz5taPg+fMZjbTv1xb\n3DSiZazP3u3M5FREW7cc5SA=\n-----END PRIVATE KEY-----\n")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "firebase-adminsdk-fbsvc@vision-match-123.iam.gserviceaccount.com")
    FIREBASE_CLIENT_ID: str = os.getenv("FIREBASE_CLIENT_ID", "103886528041599037530")

    # Standard Firebase URIs
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_CLIENT_CERT_URL: str = os.getenv("FIREBASE_CLIENT_CERT_URL", "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40vision-match-123.iam.gserviceaccount.com")

    # API Keys & Secrets
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your_fallback_secret_key")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "dfo7vvdka")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "496531328968546")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "mkZ7bWfP1JwwjSMDo2f9E_hIS2M")
    
    # Razorpay Payment Gateway (Test Credentials)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_S4Ska2RUEUUMMi")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "GO6GiFBAHR6Gd3iHqZeowNJZ")
    PAYMENT_SIMULATION_MODE: bool = os.getenv("PAYMENT_SIMULATION_MODE", "false").lower() == "true"
    
    # Exotel Call Masking
    EXOTEL_SID: str = os.getenv("EXOTEL_SID", "")
    EXOTEL_API_KEY: str = os.getenv("EXOTEL_API_KEY", "")
    EXOTEL_API_TOKEN: str = os.getenv("EXOTEL_API_TOKEN", "")
    EXOTEL_CALLER_ID: str = os.getenv("EXOTEL_CALLER_ID", "")

settings = Settings()