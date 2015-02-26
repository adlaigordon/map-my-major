<?php
    $contents = $_POST["file"];
    $name = $_POST["name"];
    $file = fopen("downloads/$name.json", "w");
    fwrite($file, $contents);
    fclose($file);
?>