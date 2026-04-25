; keep Obj on the players head

; properties to copy from the player to the object
#DEFINE keys ["Pos.x", "Pos.y", "Pos.z", "Rot.x", "Rot.y", "Rot.z"] ; list of keys to copy
#DEFINE len keys.length - 1 ; length of the list of keys

; setup once
SET Player.SelIndex 0 ; player 0 is the host
SET Player.SelPart 0  ; part 0 is Head

LABEL loop ; loop forever

  #FOR i 0 len                 ; loop over the keys
      #DEFINE key keys[i]      ; get the current key
      SET Obj.#key Player.#key ; copy the key from Player to Obj
  #END

GOTO loop ; loop forever
