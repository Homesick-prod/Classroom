// qrCode.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native'; // Import Image
import { useRouter, useLocalSearchParams } from 'expo-router';


const QrCodePage: React.FC = () => {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null); // Store data URL
  const router = useRouter();

  useEffect(() => {
    const generateQRCode = async () => {
      if (courseId) {
        const fullUrl = `https://phumin339-3.github.io/MyProject/course.html?courseId=${courseId}`;

        try {
          // Generate QR code data URL using BarCodeScanner.Constants.BarCodeType.qr
          const result = await BarCodeScanner.encodeAsync(fullUrl, BarCodeScanner.Constants.BarCodeType.qr, {
            format: 'png', // Get as PNG
          });

          if (result && result.data) {
            setQrCodeDataURL(result.data); // Store the data URL
          } else {
            console.error("QR Code generation failed:", result);
            setQrCodeDataURL(null);
          }

        } catch (error) {
          console.error("Error generating QR code:", error);
          setQrCodeDataURL(null);
        }
      } else {
        setQrCodeDataURL(null);
      }
    };

    generateQRCode();
  }, [courseId]);

  return (
    <View style={styles.container}>
      <View style={styles.qrCodeContainer}>
        <Text style={styles.header}>QR Code</Text>
        {qrCodeDataURL ? (
            <Image
                source={{ uri: qrCodeDataURL }} // Display the QR code image
                style={styles.qrCodeImage}   // Add a style for the image
            />
        ) : (
          <Text>Course ID not found.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E7E9',
  },
  qrCodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    color: '#2CBFAE',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold'
  },
  qrCodeImage: { // Add style for the image
    width: 256,
    height: 256,
  }
});

export default QrCodePage;