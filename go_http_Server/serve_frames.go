package main

import (
	"log"
	"net/http"
)

func main() {
	fs := http.FileServer(http.Dir("/dev/shm/frames"))
	http.Handle("/frames/", http.StripPrefix("/frames/", fs))

	port := ":8000"
	log.Printf("Serving frames on http://localhost%s/frames/", port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
