#DEFINE text "Sample text" ; the text to write

#DEFINE length text.length ; the length of the text
                           ; needed for looping
#FOR i 0 length-1 ; loop across characters in the text
                  ; length-1 because indexes start at 0 so they end 1 before the length
  #DEFINE char text[i] ; get the character at index i

  SET Obj.Sign.Write '#char' ; write the character to the sign
                              ; quotes convert character to ascii code ('#char' -> 'S' -> 83)
  SLEEP 0 ; delay in between characters
          ; remove for all characters at once
#END
