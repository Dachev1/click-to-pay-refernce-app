function p2j(str) {
    return jwtJsDecode.tryPromise(() => jwtJsDecode.pem2jwk(keyPriv));
  }
  
  
  async function updateJwk(key, extraEl) {
    //const key = pem.getValue().trim();
    const p2j = jwtJsDecode.tryPromise(() => jwtJsDecode.pem2jwk(key));
    //errorWatcher(p2j, pem);
    return await p2j.then(jwkObj => {
      if ((typeof jwkObj === 'object') && extraEl) {
        if (jwkObj.d) {
          jwkObj.key_ops = ['sign'];
        } else if (jwkObj.e) {
          jwkObj.key_ops = ['verify'];
        }
      }
      return jwkObj;
    })
  }
  